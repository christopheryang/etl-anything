# test_nvidia_integration.py - Tests for NVIDIA NIM integration
import pytest
from unittest.mock import Mock, patch, MagicMock
from node_handlers import _execute_nvidia_llm, handle_llm_node
from main import NVIDIA_MODELS, get_model_provider


class TestNVIDIAModelDetection:
    """Tests for model provider detection."""
    
    def test_nvidia_models_return_nvidia_provider(self):
        """Verify NVIDIA models are correctly identified."""
        for model_name in NVIDIA_MODELS.values():
            assert get_model_provider(model_name) == "nvidia"
    
    def test_anthropic_models_return_anthropic_provider(self):
        """Verify non-NVIDIA models default to Anthropic."""
        assert get_model_provider("claude-3-5-haiku-latest") == "anthropic"
        assert get_model_provider("claude-haiku-4-5") == "anthropic"
        assert get_model_provider("unknown-model") == "anthropic"


class TestNVIDIAExecution:
    """Tests for NVIDIA LLM execution."""
    
    def test_execute_nvidia_llm_success(self):
        """Test successful NVIDIA LLM execution."""
        # Mock node and data
        mock_node = Mock()
        mock_node.id = "llm-test-1"
        
        mock_data = Mock()
        mock_data.model = "qwen/qwen3.5-397b-a17b"
        mock_data.prompt = "Summarize this text"
        mock_data.temperature = 0.7
        mock_data.system_prompt = None
        
        full_prompt = "Summarize this text\n\nTest input text"
        
        # Mock NVIDIA client response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = "This is a summary of the text."
        
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        
        # Execute
        result = _execute_nvidia_llm(mock_node, mock_data, full_prompt, mock_client)
        
        # Verify
        assert result == "This is a summary of the text."
        mock_client.chat.completions.create.assert_called_once()
        
        # Verify call arguments
        call_args = mock_client.chat.completions.create.call_args
        assert call_args.kwargs["model"] == "qwen/qwen3.5-397b-a17b"
        assert call_args.kwargs["temperature"] == 0.7
        assert len(call_args.kwargs["messages"]) == 1
        assert call_args.kwargs["messages"][0]["role"] == "user"
    
    def test_execute_nvidia_llm_with_system_prompt(self):
        """Test NVIDIA LLM execution with system prompt."""
        mock_node = Mock()
        mock_node.id = "llm-test-2"
        
        mock_data = Mock()
        mock_data.model = "qwen/qwen3.5-397b-a17b"
        mock_data.prompt = "Translate to French"
        mock_data.temperature = 0.5
        mock_data.system_prompt = "You are a professional translator."
        
        full_prompt = "Translate to French\n\nHello world"
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = "Bonjour le monde"
        
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        
        result = _execute_nvidia_llm(mock_node, mock_data, full_prompt, mock_client)
        
        # Verify system prompt is included
        call_args = mock_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[0]["content"] == "You are a professional translator."
        assert messages[1]["role"] == "user"
    
    def test_execute_nvidia_llm_error(self):
        """Test NVIDIA LLM error handling."""
        mock_node = Mock()
        mock_node.id = "llm-test-3"
        
        mock_data = Mock()
        mock_data.model = "qwen/qwen3.5-397b-a17b"
        mock_data.prompt = "Test prompt"
        
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        
        with pytest.raises(RuntimeError, match="NVIDIA NIM API error"):
            _execute_nvidia_llm(mock_node, mock_data, "test", mock_client)


class TestHandleLLMNodeRouting:
    """Tests for LLM handler provider routing."""
    
    def test_handle_llm_node_routes_to_nvidia(self):
        """Verify handle_llm_node routes to NVIDIA for NVIDIA models."""
        mock_node = Mock()
        mock_node.id = "llm-routing-test"
        mock_node.data = Mock()
        mock_node.data.model = "qwen/qwen3.5-397b-a17b"
        mock_node.data.prompt = "Test"
        mock_node.data.temperature = 0.7
        mock_node.data.system_prompt = None
        
        mock_input_data = {"text": "Test input"}
        mock_anthropic = Mock()
        mock_nvidia = Mock()
        
        # Mock NVIDIA response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = "NVIDIA response"
        mock_nvidia.chat.completions.create.return_value = mock_response
        
        # Execute
        with patch('node_handlers._execute_nvidia_llm') as mock_exec:
            mock_exec.return_value = "NVIDIA response"
            result = handle_llm_node(
                mock_node, "exec-123", mock_input_data, 
                mock_anthropic, mock_nvidia
            )
            
            # Verify NVIDIA execution was called
            mock_exec.assert_called_once()
    
    def test_handle_llm_node_routes_to_anthropic(self):
        """Verify handle_llm_node routes to Anthropic for non-NVIDIA models."""
        mock_node = Mock()
        mock_node.id = "llm-routing-test-2"
        mock_node.data = Mock()
        mock_node.data.model = "haiku-4.5"
        mock_node.data.prompt = "Test"
        mock_node.data.temperature = 0.7
        mock_node.data.system_prompt = None
        
        mock_input_data = {"text": "Test input"}
        mock_anthropic = Mock()
        mock_nvidia = Mock()
        
        # Execute
        with patch('node_handlers._execute_anthropic_llm') as mock_exec:
            mock_exec.return_value = "Anthropic response"
            result = handle_llm_node(
                mock_node, "exec-123", mock_input_data, 
                mock_anthropic, mock_nvidia
            )
            
            # Verify Anthropic execution was called
            mock_exec.assert_called_once()
    
    def test_handle_llm_node_no_input_raises_error(self):
        """Verify handle_llm_node raises error with no input."""
        mock_node = Mock()
        mock_node.id = "llm-no-input"
        
        with pytest.raises(ValueError, match="requires input"):
            handle_llm_node(mock_node, "exec-123", None, Mock(), Mock())


class TestNVAModelMappings:
    """Tests for model name mappings."""
    
    def test_nvidia_models_dict_complete(self):
        """Verify all expected NVIDIA models are mapped."""
        expected_models = {
            "qwen-3.5",
            "llama-3.1-405b",
            "llama-3.1-70b",
            "gemma-2b",
        }
        
        assert set(NVIDIA_MODELS.keys()) == expected_models
    
    def test_nvidia_model_values_are_valid_api_names(self):
        """Verify NVIDIA model values match API model names."""
        # These should match the exact model names used in NVIDIA NIM API
        assert NVIDIA_MODELS["qwen-3.5"] == "qwen/qwen3.5-397b-a17b"
        assert NVIDIA_MODELS["llama-3.1-405b"] == "meta/llama-3.1-405b-instruct"
        assert NVIDIA_MODELS["llama-3.1-70b"] == "meta/llama-3.1-70b-instruct"
        assert NVIDIA_MODELS["gemma-2b"] == "google/gemma-2b"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
